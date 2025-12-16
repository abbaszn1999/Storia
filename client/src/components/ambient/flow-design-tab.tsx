import { SceneBreakdown } from "./scene-breakdown";
import type { Scene, Shot, ShotVersion, ContinuityGroup } from "@shared/schema";

interface FlowDesignTabProps {
  videoId: string;
  script: string;
  scriptModel: string;
  narrativeMode?: "image-reference" | "start-end";
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
  shotVersions?: { [shotId: string]: ShotVersion[] };
  continuityLocked?: boolean;
  continuityGroups?: { [sceneId: string]: ContinuityGroup[] };
  animationMode: 'image-transitions' | 'video-animation';
  onScenesGenerated: (scenes: Scene[], shots: { [sceneId: string]: Shot[] }, shotVersions?: { [shotId: string]: ShotVersion[] }) => void;
  onContinuityLocked?: () => void;
  onContinuityGroupsChange?: (groups: { [sceneId: string]: ContinuityGroup[] }) => void;
  onNext: () => void;
}

export function FlowDesignTab({
  videoId,
  script,
  scriptModel,
  narrativeMode,
  scenes,
  shots,
  shotVersions,
  continuityLocked,
  continuityGroups,
  animationMode,
  onScenesGenerated,
  onContinuityLocked,
  onContinuityGroupsChange,
  onNext,
}: FlowDesignTabProps) {
  return (
    <SceneBreakdown
      videoId={videoId}
      script={script}
      scriptModel={scriptModel}
      narrativeMode={narrativeMode}
      scenes={scenes}
      shots={shots}
      shotVersions={shotVersions}
      continuityLocked={continuityLocked}
      continuityGroups={continuityGroups}
      onScenesGenerated={onScenesGenerated}
      onContinuityLocked={onContinuityLocked}
      onContinuityGroupsChange={onContinuityGroupsChange}
      onNext={onNext}
    />
  );
}
