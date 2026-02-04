/**
 * Static imports for story-mode prompts so esbuild can bundle them.
 * Dynamic import(`../../${mode}/prompts/...`) fails at runtime when the server
 * is deployed as a single bundle (no separate prompt files on disk).
 */

export type StoryModeForPrompts = "problem-solution" | "before-after" | "myth-busting" | "tease-reveal";

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

const musicByMode: Record<StoryModeForPrompts, typeof psMusic> = {
  "problem-solution": psMusic,
  "before-after": baMusic,
  "myth-busting": mbMusic,
  "tease-reveal": trMusic,
};

const ideaByMode: Record<StoryModeForPrompts, typeof psIdea> = {
  "problem-solution": psIdea,
  "before-after": baIdea,
  "myth-busting": mbIdea,
  "tease-reveal": trIdea,
};

const sceneByMode: Record<StoryModeForPrompts, typeof psScene> = {
  "problem-solution": psScene,
  "before-after": baScene,
  "myth-busting": mbScene,
  "tease-reveal": trScene,
};

const storyboardByMode: Record<StoryModeForPrompts, typeof psStoryboard> = {
  "problem-solution": psStoryboard,
  "before-after": baStoryboard,
  "myth-busting": mbStoryboard,
  "tease-reveal": trStoryboard,
};

const transitionByMode: Record<StoryModeForPrompts, typeof psTransition> = {
  "problem-solution": psTransition,
  "before-after": baTransition,
  "myth-busting": mbTransition,
  "tease-reveal": trTransition,
};

const imageByMode: Record<StoryModeForPrompts, typeof psImage> = {
  "problem-solution": psImage,
  "before-after": baImage,
  "myth-busting": mbImage,
  "tease-reveal": trImage,
};

const videoByMode: Record<StoryModeForPrompts, typeof psVideo> = {
  "problem-solution": psVideo,
  "before-after": baVideo,
  "myth-busting": mbVideo,
  "tease-reveal": trVideo,
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
