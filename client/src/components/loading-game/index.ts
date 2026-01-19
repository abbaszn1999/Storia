/**
 * Film Reel Catcher Loading Game
 * 
 * A fun mini-game that plays during loading screens.
 * Inspired by Chrome's Dino game, but themed for video/film production.
 * 
 * @example
 * // 1. Wrap your app with the provider
 * import { LoadingGameProvider } from '@/components/loading-game';
 * 
 * function App() {
 *   return (
 *     <LoadingGameProvider>
 *       <YourApp />
 *     </LoadingGameProvider>
 *   );
 * }
 * 
 * @example
 * // 2. Use the hook anywhere in your app
 * import { useLoadingGame } from '@/components/loading-game';
 * 
 * function SomeComponent() {
 *   const { showGame, setProgress, hideGame, withLoading } = useLoadingGame();
 * 
 *   // Option A: Manual control
 *   const handleLoad = async () => {
 *     showGame({ title: 'Loading your video...' });
 *     
 *     for (let i = 0; i <= 100; i += 10) {
 *       await someAsyncWork();
 *       setProgress(i);
 *     }
 *     
 *     hideGame();
 *   };
 * 
 *   // Option B: Using withLoading helper
 *   const handleLoadAuto = async () => {
 *     await withLoading(
 *       async (updateProgress) => {
 *         for (let i = 0; i <= 100; i += 10) {
 *           await someAsyncWork();
 *           updateProgress(i);
 *         }
 *       },
 *       { title: 'Preparing...' }
 *     );
 *   };
 * }
 */

export { LoadingGameProvider, useLoadingGame } from './LoadingGameProvider';
export { FilmCatcherGame } from './FilmCatcherGame';
export { GameCanvas } from './GameCanvas';
export { useGameLoop } from './useGameLoop';
export type { LoadingGameConfig, GameState, GameObject, Particle } from './types';
export { GAME_CONFIG, GOOD_ITEMS, BAD_ITEMS } from './types';
