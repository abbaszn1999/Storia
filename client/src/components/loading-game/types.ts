/**
 * Types for Film Reel Catcher Loading Game
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

export interface GameObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  type: 'good' | 'bad';
  emoji: string;
  points: number;
}

export interface Basket {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GameState {
  score: number;
  highScore: number;
  isPlaying: boolean;
  isPaused: boolean;
  objects: GameObject[];
  basket: Basket;
  lives: number;
  level: number;
  combo: number;
  lastCatch: 'good' | 'bad' | null;
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
];

export const GAME_CONFIG = {
  CANVAS_WIDTH: 600,  // Wider canvas
  CANVAS_HEIGHT: 500, // Slightly shorter for better aspect ratio
  BASKET_WIDTH: 80,   // Bigger basket
  BASKET_HEIGHT: 55,
  OBJECT_SIZE: 50,    // Bigger items
  INITIAL_SPAWN_RATE: 1500, // ms
  MIN_SPAWN_RATE: 500,
  INITIAL_SPEED: 2.5,
  MAX_SPEED: 7,
  LIVES: 3,
  LEVEL_UP_SCORE: 200,
  GOOD_ITEM_CHANCE: 0.75,
};
