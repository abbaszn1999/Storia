/**
 * Loading Game Provider
 * 
 * Global context provider that manages the loading game state.
 * Wrap your app with this provider to enable loading games anywhere.
 * 
 * Usage:
 * 1. Wrap your app: <LoadingGameProvider><App /></LoadingGameProvider>
 * 2. In any component: const { showGame, hideGame, setProgress } = useLoadingGame();
 * 3. Show game: showGame({ title: 'Loading...' });
 * 4. Update progress: setProgress(50);
 * 5. Complete: setProgress(100); hideGame();
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useMemo,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FilmCatcherGame } from './FilmCatcherGame';
import type { LoadingGameConfig } from './types';

interface LoadingGameContextValue {
  /** Whether the game is currently visible */
  isVisible: boolean;
  /** Current loading progress (0-100) */
  progress: number;
  /** Show the loading game */
  showGame: (config?: Partial<LoadingGameConfig>) => void;
  /** Hide the loading game */
  hideGame: () => void;
  /** Update loading progress */
  setProgress: (value: number) => void;
  /** Shortcut: show game, run async function with progress updates, hide game */
  withLoading: <T>(
    asyncFn: (updateProgress: (p: number) => void) => Promise<T>,
    config?: Partial<LoadingGameConfig>
  ) => Promise<T>;
}

const LoadingGameContext = createContext<LoadingGameContextValue | null>(null);

interface LoadingGameProviderProps {
  children: ReactNode;
}

export function LoadingGameProvider({ children }: LoadingGameProviderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgressState] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [config, setConfig] = useState<Partial<LoadingGameConfig>>({});

  const showGame = useCallback((newConfig?: Partial<LoadingGameConfig>) => {
    setConfig(newConfig || {});
    setProgressState(0);
    setIsComplete(false);
    setIsVisible(true);
  }, []);

  const hideGame = useCallback(() => {
    setIsComplete(true);
    // Delay actual hide to show completion animation
    setTimeout(() => {
      setIsVisible(false);
      setProgressState(0);
      setIsComplete(false);
      setConfig({});
    }, 1500);
  }, []);

  const setProgress = useCallback((value: number) => {
    setProgressState(Math.min(100, Math.max(0, value)));
    
    // Auto-complete when progress reaches 100
    if (value >= 100) {
      setIsComplete(true);
    }
  }, []);

  const withLoading = useCallback(async <T,>(
    asyncFn: (updateProgress: (p: number) => void) => Promise<T>,
    loadingConfig?: Partial<LoadingGameConfig>
  ): Promise<T> => {
    showGame(loadingConfig);
    
    try {
      const result = await asyncFn(setProgress);
      hideGame();
      return result;
    } catch (error) {
      hideGame();
      throw error;
    }
  }, [showGame, hideGame, setProgress]);

  const contextValue = useMemo(
    () => ({
      isVisible,
      progress,
      showGame,
      hideGame,
      setProgress,
      withLoading,
    }),
    [isVisible, progress, showGame, hideGame, setProgress, withLoading]
  );

  return (
    <LoadingGameContext.Provider value={contextValue}>
      {children}
      
      {/* Loading Game Overlay */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
            }}
          >
            {/* Animated background orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                className="absolute w-[600px] h-[600px] rounded-full opacity-20"
                style={{
                  background: 'radial-gradient(circle, #10b981 0%, transparent 70%)',
                  left: '10%',
                  top: '20%',
                }}
                animate={{
                  x: [0, 50, 0],
                  y: [0, 30, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <motion.div
                className="absolute w-[500px] h-[500px] rounded-full opacity-15"
                style={{
                  background: 'radial-gradient(circle, #14b8a6 0%, transparent 70%)',
                  right: '10%',
                  bottom: '20%',
                }}
                animate={{
                  x: [0, -40, 0],
                  y: [0, -40, 0],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </div>

            {/* Game */}
            <FilmCatcherGame
              progress={progress}
              isComplete={isComplete}
              title={config.title}
              subtitle={config.subtitle}
              onComplete={config.onComplete}
            />

            {/* Optional: Skip button (only visible after 3 seconds) */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              whileHover={{ opacity: 1 }}
              transition={{ delay: 3 }}
              onClick={hideGame}
              className="absolute bottom-6 right-6 text-white/50 hover:text-white text-sm underline transition-colors"
            >
              Skip
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </LoadingGameContext.Provider>
  );
}

/**
 * Hook to access loading game controls
 */
export function useLoadingGame() {
  const context = useContext(LoadingGameContext);
  
  if (!context) {
    throw new Error(
      'useLoadingGame must be used within a LoadingGameProvider. ' +
      'Wrap your app with <LoadingGameProvider>.'
    );
  }
  
  return context;
}
