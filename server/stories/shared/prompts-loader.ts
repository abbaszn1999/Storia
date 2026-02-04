/**
 * Static imports for story-mode prompts so esbuild can bundle them.
 * Dynamic import(`../../${mode}/prompts/...`) fails at runtime when the server
 * is deployed as a single bundle (no separate prompt files on disk).
 */

export type StoryModeForPrompts = "problem-solution" | "before-after" | "myth-busting" | "tease-reveal" | "auto-asmr";

// problem-solution (shared/ is under stories/, so one level up = stories/)
import * as psMusic from "../problem-solution/prompts/music-prompts";
import * as psIdea from "../problem-solution/prompts/idea-prompts";
import * as psScene from "../problem-solution/prompts/scene-prompts";
import * as psStoryboard from "../problem-solution/prompts/storyboard-prompts";
import * as psTransition from "../problem-solution/prompts/transition-prompts";
import * as psImage from "../problem-solution/prompts/image-prompts";
import * as psVideo from "../problem-solution/prompts/video-prompts";

// before-after
import * as baMusic from "../before-after/prompts/music-prompts";
import * as baIdea from "../before-after/prompts/idea-prompts";
import * as baScene from "../before-after/prompts/scene-prompts";
import * as baStoryboard from "../before-after/prompts/storyboard-prompts";
import * as baTransition from "../before-after/prompts/transition-prompts";
import * as baImage from "../before-after/prompts/image-prompts";
import * as baVideo from "../before-after/prompts/video-prompts";

// myth-busting
import * as mbMusic from "../myth-busting/prompts/music-prompts";
import * as mbIdea from "../myth-busting/prompts/idea-prompts";
import * as mbScene from "../myth-busting/prompts/scene-prompts";
import * as mbStoryboard from "../myth-busting/prompts/storyboard-prompts";
import * as mbTransition from "../myth-busting/prompts/transition-prompts";
import * as mbImage from "../myth-busting/prompts/image-prompts";
import * as mbVideo from "../myth-busting/prompts/video-prompts";

// tease-reveal
import * as trMusic from "../tease-reveal/prompts/music-prompts";
import * as trIdea from "../tease-reveal/prompts/idea-prompts";
import * as trScene from "../tease-reveal/prompts/scene-prompts";
import * as trStoryboard from "../tease-reveal/prompts/storyboard-prompts";
import * as trTransition from "../tease-reveal/prompts/transition-prompts";
import * as trImage from "../tease-reveal/prompts/image-prompts";
import * as trVideo from "../tease-reveal/prompts/video-prompts";

// auto-asmr
import * as asmrMusic from "../auto-asmr/prompts/music-prompts";
import * as asmrIdea from "../auto-asmr/prompts/idea-prompts";
import * as asmrScene from "../auto-asmr/prompts/scene-prompts";
import * as asmrStoryboard from "../auto-asmr/prompts/storyboard-prompts";
import * as asmrTransition from "../auto-asmr/prompts/transition-prompts";
import * as asmrImage from "../auto-asmr/prompts/image-prompts";
import * as asmrVideo from "../auto-asmr/prompts/video-prompts";

// Union types so all mode modules are accepted (they have compatible-but-different exports)
type MusicPromptsModule = typeof psMusic | typeof baMusic | typeof mbMusic | typeof trMusic | typeof asmrMusic;
type IdeaPromptsModule = typeof psIdea | typeof baIdea | typeof mbIdea | typeof trIdea | typeof asmrIdea;
type ScenePromptsModule = typeof psScene | typeof baScene | typeof mbScene | typeof trScene | typeof asmrScene;
type StoryboardPromptsModule = typeof psStoryboard | typeof baStoryboard | typeof mbStoryboard | typeof trStoryboard | typeof asmrStoryboard;
type TransitionPromptsModule = typeof psTransition | typeof baTransition | typeof mbTransition | typeof trTransition | typeof asmrTransition;
type ImagePromptsModule = typeof psImage | typeof baImage | typeof mbImage | typeof trImage | typeof asmrImage;
type VideoPromptsModule = typeof psVideo | typeof baVideo | typeof mbVideo | typeof trVideo | typeof asmrVideo;

const musicByMode: Record<StoryModeForPrompts, MusicPromptsModule> = {
  "problem-solution": psMusic,
  "before-after": baMusic,
  "myth-busting": mbMusic,
  "tease-reveal": trMusic,
  "auto-asmr": asmrMusic,
};

const ideaByMode: Record<StoryModeForPrompts, IdeaPromptsModule> = {
  "problem-solution": psIdea,
  "before-after": baIdea,
  "myth-busting": mbIdea,
  "tease-reveal": trIdea,
  "auto-asmr": asmrIdea,
};

const sceneByMode: Record<StoryModeForPrompts, ScenePromptsModule> = {
  "problem-solution": psScene,
  "before-after": baScene,
  "myth-busting": mbScene,
  "tease-reveal": trScene,
  "auto-asmr": asmrScene,
};

const storyboardByMode: Record<StoryModeForPrompts, StoryboardPromptsModule> = {
  "problem-solution": psStoryboard,
  "before-after": baStoryboard,
  "myth-busting": mbStoryboard,
  "tease-reveal": trStoryboard,
  "auto-asmr": asmrStoryboard,
};

const transitionByMode: Record<StoryModeForPrompts, TransitionPromptsModule> = {
  "problem-solution": psTransition,
  "before-after": baTransition,
  "myth-busting": mbTransition,
  "tease-reveal": trTransition,
  "auto-asmr": asmrTransition,
};

const imageByMode: Record<StoryModeForPrompts, ImagePromptsModule> = {
  "problem-solution": psImage,
  "before-after": baImage,
  "myth-busting": mbImage,
  "tease-reveal": trImage,
  "auto-asmr": asmrImage,
};

const videoByMode: Record<StoryModeForPrompts, VideoPromptsModule> = {
  "problem-solution": psVideo,
  "before-after": baVideo,
  "myth-busting": mbVideo,
  "tease-reveal": trVideo,
  "auto-asmr": asmrVideo,
};

export function getMusicPrompts(mode: StoryModeForPrompts) {
  return musicByMode[mode];
}

export function getIdeaPrompts(mode: StoryModeForPrompts) {
  return ideaByMode[mode];
}

export function getScenePrompts(mode: StoryModeForPrompts) {
  return sceneByMode[mode];
}

export function getStoryboardPrompts(mode: StoryModeForPrompts) {
  return storyboardByMode[mode];
}

export function getTransitionPrompts(mode: StoryModeForPrompts) {
  return transitionByMode[mode];
}

export function getImagePrompts(mode: StoryModeForPrompts) {
  return imageByMode[mode];
}

export function getVideoPrompts(mode: StoryModeForPrompts) {
  return videoByMode[mode];
}
